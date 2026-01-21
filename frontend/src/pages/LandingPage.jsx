import { motion } from 'framer-motion';
import { ArrowRight, Check, Zap, Shield, BarChart3, Code2, Users, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import styles from './LandingPage.module.css';

export default function LandingPage() {
    const features = [
        {
            icon: Zap,
            title: 'Multi-Provider Support',
            description: 'Connect to 8+ LLM providers including OpenAI, Gemini, Claude, and Mistral in one unified platform.'
        },
        {
            icon: BarChart3,
            title: 'Analytics Dashboard',
            description: 'Track costs, performance, and usage patterns across all your AI prompts and providers.'
        },
        {
            icon: Code2,
            title: 'API Integration',
            description: 'Seamlessly integrate with your existing workflows via our RESTful API and webhooks.'
        },
        {
            icon: Shield,
            title: 'Enterprise Security',
            description: 'Zero-trust architecture with client-side encryption, SOC 2 compliance, and GDPR ready.'
        }
    ];

    const providers = ['OpenAI', 'Google Gemini', 'Anthropic', 'Mistral AI', 'Cohere', 'Perplexity', 'Groq', 'xAI Grok'];

    const pricingPlans = [
        {
            name: 'Starter',
            price: '0',
            description: 'Perfect for individuals',
            features: ['100 prompts/month', '2 team members', 'Basic analytics', 'Community support']
        },
        {
            name: 'Professional',
            price: '49',
            description: 'For growing teams',
            features: ['Unlimited prompts', '10 team members', 'Advanced analytics', 'Priority support', 'API access'],
            popular: true
        },
        {
            name: 'Enterprise',
            price: 'Custom',
            description: 'For large organizations',
            features: ['Unlimited everything', 'Unlimited team members', 'Custom integrations', 'Dedicated support', 'SLA guarantee', 'On-premise option']
        }
    ];

    return (
        <div className={styles.landing}>
            {/* Hero Section */}
            <section className={styles.hero}>
                <div className={styles.heroBackground}>
                    <div className={styles.gridPattern}></div>
                    <div className={styles.gradientOrb1}></div>
                    <div className={styles.gradientOrb2}></div>
                </div>

                <motion.div
                    className={styles.heroContent}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <div className={styles.badge}>
                        <Zap size={16} />
                        <span>Trusted by 10,000+ teams worldwide</span>
                    </div>

                    <h1 className={styles.heroTitle}>
                        AI Prompt Management
                        <span className={styles.gradient}> at Scale</span>
                    </h1>

                    <p className={styles.heroSubtitle}>
                        Unify, optimize, and analyze your AI prompts across all providers with enterprise-grade security.
                        Save time, reduce costs, and ship faster.
                    </p>

                    <div className={styles.heroButtons}>
                        <Link to="/register" className={styles.primaryButton}>
                            Get Started Free
                            <ArrowRight size={20} />
                        </Link>
                        <button className={styles.secondaryButton}>
                            Request Demo
                        </button>
                    </div>

                    <div className={styles.trustBadges}>
                        <div className={styles.trustBadge}>
                            <Shield size={20} />
                            <span>SOC 2 Type II</span>
                        </div>
                        <div className={styles.trustBadge}>
                            <Shield size={20} />
                            <span>GDPR Compliant</span>
                        </div>
                        <div className={styles.trustBadge}>
                            <Shield size={20} />
                            <span>ISO 27001</span>
                        </div>
                    </div>
                </motion.div>

                {/* Floating UI Preview */}
                <motion.div
                    className={styles.heroPreview}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, delay: 0.3 }}
                >
                    <div className={styles.previewCard}>
                        <div className={styles.previewHeader}>
                            <div className={styles.dots}>
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                            <span className={styles.previewTitle}>Test Sandbox</span>
                        </div>
                        <div className={styles.previewContent}>
                            <div className={styles.previewStat}>
                                <BarChart3 size={24} />
                                <div>
                                    <div className={styles.statValue}>$0.0023</div>
                                    <div className={styles.statLabel}>Cost per request</div>
                                </div>
                            </div>
                            <div className={styles.previewStat}>
                                <Zap size={24} />
                                <div>
                                    <div className={styles.statValue}>847ms</div>
                                    <div className={styles.statLabel}>Avg latency</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Providers Marquee */}
            <section className={styles.providers}>
                <p className={styles.providersLabel}>Integrated with leading AI providers</p>
                <div className={styles.providersMarquee}>
                    {[...providers, ...providers].map((provider, index) => (
                        <span key={index} className={styles.providerBadge}>{provider}</span>
                    ))}
                </div>
            </section>

            {/* Features Section */}
            <section className={styles.features}>
                <motion.div
                    className={styles.sectionHeader}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <h2>Everything you need to manage AI at scale</h2>
                    <p>Powerful features designed for modern development teams</p>
                </motion.div>

                <div className={styles.featuresGrid}>
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            className={styles.featureCard}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <div className={styles.featureIcon}>
                                <feature.icon size={24} />
                            </div>
                            <h3>{feature.title}</h3>
                            <p>{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Pricing Section */}
            <section className={styles.pricing}>
                <motion.div
                    className={styles.sectionHeader}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <h2>Simple, transparent pricing</h2>
                    <p>Choose the plan that's right for your team</p>
                </motion.div>

                <div className={styles.pricingGrid}>
                    {pricingPlans.map((plan, index) => (
                        <motion.div
                            key={index}
                            className={`${styles.pricingCard} ${plan.popular ? styles.popular : ''}`}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                        >
                            {plan.popular && <div className={styles.popularBadge}>Most Popular</div>}
                            <h3>{plan.name}</h3>
                            <div className={styles.price}>
                                {plan.price === 'Custom' ? (
                                    <span className={styles.customPrice}>Custom</span>
                                ) : (
                                    <>
                                        <span className={styles.currency}>$</span>
                                        <span className={styles.amount}>{plan.price}</span>
                                        <span className={styles.period}>/month</span>
                                    </>
                                )}
                            </div>
                            <p className={styles.planDescription}>{plan.description}</p>
                            <ul className={styles.features}>
                                {plan.features.map((feature, i) => (
                                    <li key={i}>
                                        <Check size={20} />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            <Link
                                to={plan.price === 'Custom' ? '/contact' : '/register'}
                                className={plan.popular ? styles.primaryButton : styles.secondaryButton}
                            >
                                {plan.price === 'Custom' ? 'Contact Sales' : 'Get Started'}
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* CTA Section */}
            <section className={styles.cta}>
                <motion.div
                    className={styles.ctaContent}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <h2>Ready to optimize your AI workflow?</h2>
                    <p>Join thousands of teams already using PromptOps</p>
                    <Link to="/register" className={styles.ctaButton}>
                        Start Free Trial
                        <ArrowRight size={20} />
                    </Link>
                </motion.div>
            </section>

            {/* Footer */}
            <footer className={styles.footer}>
                <div className={styles.footerContent}>
                    <div className={styles.footerBrand}>
                        <h3>PromptOps</h3>
                        <p>Enterprise AI prompt management</p>
                    </div>
                    <div className={styles.footerLinks}>
                        <div>
                            <h4>Product</h4>
                            <a href="#">Features</a>
                            <a href="#">Pricing</a>
                            <a href="#">API</a>
                        </div>
                        <div>
                            <h4>Company</h4>
                            <a href="#">About</a>
                            <a href="#">Blog</a>
                            <a href="#">Careers</a>
                        </div>
                        <div>
                            <h4>Legal</h4>
                            <a href="#">Privacy</a>
                            <a href="#">Terms</a>
                            <a href="#">Security</a>
                        </div>
                    </div>
                </div>
                <div className={styles.footerBottom}>
                    <p>© 2026 PromptOps. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
