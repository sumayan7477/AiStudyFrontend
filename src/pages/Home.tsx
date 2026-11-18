import React from 'react';
import { Link } from 'react-router-dom';
import { 
  SparklesIcon, 
  BookOpenIcon, 
  ChatBubbleLeftRightIcon, 
  ClipboardDocumentListIcon,
  AcademicCapIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section - Fixed spacing and layout */}
      <div className="hero min-h-[70vh] bg-gradient-to-br from-primary/10 via-base-200 to-secondary/10 rounded-3xl p-8 md:p-12">
        <div className="hero-content flex-col lg:flex-row-reverse gap-12 max-w-6xl">
          <div className="text-center lg:text-left flex-1">
            <div className="badge badge-primary badge-lg mb-4 gap-2">
              <RocketLaunchIcon className="h-4 w-4" />
              AI-Powered Learning
            </div>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              Welcome to <br />
              <span className="text-primary">AI</span>StudyAssistant
            </h1>
            <p className="py-6 text-lg md:text-xl max-w-2xl">
              Your intelligent learning companion powered by artificial intelligence.
              Learn smarter, not harder with personalized assistance.
            </p>
            <div className="flex gap-4 justify-center lg:justify-start flex-wrap">
              <Link to="/courses" className="btn btn-primary btn-lg gap-2">
                <BookOpenIcon className="h-5 w-5" />
                Explore Courses
              </Link>
              <Link to="/register" className="btn btn-outline btn-lg">
                Get Started Free
              </Link>
            </div>
          </div>
          
          {/* Hero Illustration/Icon */}
          <div className="flex-1 flex justify-center">
            <div className="w-64 h-64 lg:w-80 lg:h-80 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
              <AcademicCapIcon className="w-32 h-32 text-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* Features Section - Better cards with hover effects */}
      <div className="py-16 px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold">Why Choose <span className="text-primary">AI</span>StudyAssistant?</h2>
          <p className="text-lg opacity-70 mt-2">Powerful features to accelerate your learning</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
            <div className="card-body items-center text-center">
              <div className="bg-primary/10 p-4 rounded-full">
                <SparklesIcon className="h-12 w-12 text-primary" />
              </div>
              <h2 className="card-title text-2xl mt-4">AI-Powered Learning</h2>
              <p className="text-base-content/70">
                Get personalized explanations and learning paths tailored to your needs and pace.
              </p>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
            <div className="card-body items-center text-center">
              <div className="bg-secondary/10 p-4 rounded-full">
                <ChatBubbleLeftRightIcon className="h-12 w-12 text-secondary" />
              </div>
              <h2 className="card-title text-2xl mt-4">Interactive Chat</h2>
              <p className="text-base-content/70">
                Ask questions and get instant, detailed responses from our advanced AI assistant.
              </p>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
            <div className="card-body items-center text-center">
              <div className="bg-accent/10 p-4 rounded-full">
                <ClipboardDocumentListIcon className="h-12 w-12 text-accent" />
              </div>
              <h2 className="card-title text-2xl mt-4">Quizzes & Assessments</h2>
              <p className="text-base-content/70">
                Test your knowledge with interactive quizzes and track your progress over time.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section - Added for better visual appeal */}
      <div className="stats shadow stats-vertical lg:stats-horizontal w-full max-w-4xl mx-auto my-8">
        <div className="stat">
          <div className="stat-figure text-primary">
            <BookOpenIcon className="h-8 w-8" />
          </div>
          <div className="stat-title">Courses</div>
          <div className="stat-value text-primary">50+</div>
          <div className="stat-desc">And growing daily</div>
        </div>
        
        <div className="stat">
          <div className="stat-figure text-secondary">
            <ChatBubbleLeftRightIcon className="h-8 w-8" />
          </div>
          <div className="stat-title">AI Interactions</div>
          <div className="stat-value text-secondary">10K+</div>
          <div className="stat-desc">Questions answered</div>
        </div>
        
        <div className="stat">
          <div className="stat-figure text-accent">
            <AcademicCapIcon className="h-8 w-8" />
          </div>
          <div className="stat-title">Students</div>
          <div className="stat-value text-accent">5K+</div>
          <div className="stat-desc">Active learners</div>
        </div>
      </div>

      {/* CTA Section - Fixed spacing */}
      <div className="hero bg-gradient-to-r from-primary to-secondary text-primary-content rounded-3xl my-16 mx-4">
        <div className="hero-content text-center py-16 px-8">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-bold">Ready to Start Learning?</h2>
            <p className="py-6 text-lg opacity-90">
              Join thousands of students already using AIStudyAssistant to accelerate their learning journey.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link to="/register" className="btn btn-secondary btn-lg">
                Create Free Account
              </Link>
              <Link to="/login" className="btn btn-ghost btn-lg text-primary-content border-primary-content/20">
                Login →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;